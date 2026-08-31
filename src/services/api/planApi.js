/**
 * Plan API
 * 
 * API calls for training plans and program details.
 */

import apiClient from './apiClient';
import CacheStorage from '../storage/CacheStorage';

const planApi = {
  /**
   * Get program details with tasks
   * Network-first with offline cache fallback.
   * @param {string} programId - Program ID
   * @returns {Promise<object>} Program with tasks
   */
  async getProgramDetails(programId) {
    // CNT-1: the cache entry is keyed by the version it actually holds, so a
    // cached payload can never masquerade as a newer version. The version id
    // lives *inside* the response, so it can't be known before the fetch --
    // hence the pointer entry, which records which versioned key is current.
    // A publish moves the pointer and lands the new payload under a new key;
    // the superseded entry is orphaned and ages out on the normal TTL.
    const pointerKey = `program_details_ptr_${programId}`;

    try {
      const response = await apiClient.get(`/api/gamification/plans/${programId}`);
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to fetch program details');
      }
      const plan = response.data.data.plan;
      const versionedKey = `program_details_${programId}_v${plan.currentVersionId || 'none'}`;
      await CacheStorage.set(versionedKey, plan);
      await CacheStorage.set(pointerKey, versionedKey);
      return plan;
    } catch (error) {
      // Offline fallback: follow the pointer to the last known version's payload.
      console.log('Fetching failed, using cache for program details:', programId);
      const versionedKey = await CacheStorage.get(pointerKey);
      const cached = versionedKey ? await CacheStorage.get(versionedKey) : null;
      if (cached == null) {
        throw new Error('Failed to fetch program details');
      }
      return cached;
    }
  },

  /**
   * Get a published plan VERSION -- an immutable snapshot.
   * CNT-1: this is what an assigned athlete trains. The assignment pins a
   * versionId, and that pin does not move when the author edits or even
   * republishes the plan (until an explicit roll-forward), so reading through
   * here is what keeps in-progress authoring invisible to assigned athletes.
   *
   * Returned plan-shaped so screens consume it exactly like getProgramDetails:
   * the wire puts the full-fidelity tasks at `version.snapshot.tasks`, not
   * `version.tasks`.
   *
   * @param {string} versionId - Plan version ID (from an assignment's versionId)
   * @returns {Promise<object>} Plan-shaped snapshot with tasks
   */
  async getPlanVersion(versionId) {
    if (!versionId) {
      throw new Error('versionId is required');
    }

    // A version snapshot is immutable, so the id alone is a complete cache key
    // -- there is no such thing as a stale entry for a given versionId.
    const version = await CacheStorage.getWithFallback(
      `plan_version_${versionId}`,
      async () => {
        const response = await apiClient.get(
          `/api/gamification/plans/versions/${versionId}`
        );
        if (response.data.status !== 'success') {
          throw new Error(response.data.message || 'Failed to fetch plan version');
        }
        return response.data.data.version;
      }
    );

    if (version == null) {
      throw new Error('Failed to fetch plan version');
    }

    const snapshot = version.snapshot || {};
    return {
      ...snapshot,
      programId: version.programId || snapshot.programId,
      versionId: version.versionId || versionId,
      versionNo: version.versionNo,
      tasks: snapshot.tasks || [],
    };
  },

  /**
   * Get assignment details with program and tasks
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<object>} Assignment with program and tasks
   */
  async getAssignmentDetails(assignmentId) {
    try {
      
      const response = await apiClient.get(`/api/gamification/assignments/${assignmentId}`);
      
      if (response.data.status === 'success') {
        return response.data.data.assignment;
      } else {
        throw new Error(response.data.message || 'Failed to fetch assignment details');
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      throw error;
    }
  },

  /**
   * Browse training plans from library
   * @param {object} params - Query parameters
   * @param {string} params.sportCategory - Filter by sport category
   * @param {string} params.difficulty - Filter by difficulty (easy, medium, hard, elite)
   * @param {string} params.searchQuery - Search query
   * @param {string} params.visibility - Filter by visibility (public, team, organization, private)
   * @param {string} params.sortBy - Sort by (rating, saves, recent, popular, name)
   * @param {string} params.sortOrder - Sort order (asc, desc)
   * @param {number} params.limit - Number of results (default: 20)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @returns {Promise<object>} Object with plans array and total count
   */
  async browsePrograms(params = {}) {
    try {
      
      const queryParams = new URLSearchParams();
      
      // Add all supported filter parameters
      if (params.sportCategory) {
        queryParams.append('sportCategory', params.sportCategory);
      }
      if (params.difficulty) {
        queryParams.append('difficulty', params.difficulty);
      }
      if (params.searchQuery) {
        queryParams.append('searchQuery', params.searchQuery);
      }
      if (params.visibility) {
        queryParams.append('visibility', params.visibility);
      }
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.offset !== undefined) {
        queryParams.append('offset', params.offset.toString());
      }

      const queryString = queryParams.toString();
      const url = `/api/gamification/plans/library${queryString ? `?${queryString}` : ''}`;

      // Network-first with offline cache fallback, keyed per query.
      const data = await CacheStorage.getWithFallback(
        `plans_library_${queryString || 'default'}`,
        async () => {
          const response = await apiClient.get(url);
          if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'Failed to fetch programs');
          }
          return response.data.data; // Returns { plans: [], total: number }
        }
      );

      if (data == null) {
        throw new Error('Failed to fetch programs');
      }
      return data;
    } catch (error) {
      console.error('Error browsing programs:', error);
      throw error;
    }
  },
};

export default planApi;
