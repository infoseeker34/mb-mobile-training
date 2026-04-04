import { profileSchema, messageSchema, searchSchema, validate } from '../validation';

describe('profileSchema', () => {
  const validProfile = {
    displayName: 'JohnDoe',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    phoneNumber: '5551234567',
    email: 'john@example.com',
    username: 'johndoe',
  };

  it('accepts a valid profile', () => {
    const result = validate(profileSchema, validProfile);
    expect(result.valid).toBe(true);
  });

  it('rejects empty displayName', () => {
    const result = validate(profileSchema, { ...validProfile, displayName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.displayName).toBeDefined();
  });

  it('rejects displayName shorter than 2 chars', () => {
    const result = validate(profileSchema, { ...validProfile, displayName: 'A' });
    expect(result.valid).toBe(false);
    expect(result.errors.displayName).toMatch(/2 characters/);
  });

  it('rejects empty firstName', () => {
    const result = validate(profileSchema, { ...validProfile, firstName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
  });

  it('rejects invalid dateOfBirth format', () => {
    const result = validate(profileSchema, { ...validProfile, dateOfBirth: '01/15/1990' });
    expect(result.valid).toBe(false);
    expect(result.errors.dateOfBirth).toBeDefined();
  });

  it('rejects invalid gender value', () => {
    const result = validate(profileSchema, { ...validProfile, gender: 'unknown' });
    expect(result.valid).toBe(false);
    expect(result.errors.gender).toBeDefined();
  });

  it('rejects phone number with wrong digit count', () => {
    const result = validate(profileSchema, { ...validProfile, phoneNumber: '12345' });
    expect(result.valid).toBe(false);
    expect(result.errors.phoneNumber).toBeDefined();
  });

  it('accepts empty/missing phoneNumber (optional)', () => {
    const result = validate(profileSchema, { ...validProfile, phoneNumber: '' });
    expect(result.valid).toBe(true);
  });

  it('accepts all three gender values', () => {
    ['male', 'female', 'other'].forEach(g => {
      expect(validate(profileSchema, { ...validProfile, gender: g }).valid).toBe(true);
    });
  });
});

describe('messageSchema', () => {
  it('accepts valid message content', () => {
    const result = validate(messageSchema, { content: 'Hello there!' });
    expect(result.valid).toBe(true);
  });

  it('rejects empty content', () => {
    const result = validate(messageSchema, { content: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.content).toBeDefined();
  });

  it('rejects content with null bytes', () => {
    const result = validate(messageSchema, { content: 'hello\0world' });
    expect(result.valid).toBe(false);
  });

  it('rejects content over 5000 chars', () => {
    const result = validate(messageSchema, { content: 'a'.repeat(5001) });
    expect(result.valid).toBe(false);
  });
});

describe('searchSchema', () => {
  it('accepts valid search query', () => {
    expect(validate(searchSchema, { query: 'beginner yoga' }).valid).toBe(true);
  });

  it('accepts empty query (optional field)', () => {
    expect(validate(searchSchema, {}).valid).toBe(true);
  });

  it('rejects query with special injection characters', () => {
    const result = validate(searchSchema, { query: '<script>alert(1)</script>' });
    expect(result.valid).toBe(false);
  });
});

describe('validate helper', () => {
  it('returns valid:true and data on success', () => {
    const result = validate(messageSchema, { content: 'hi' });
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toEqual({});
  });

  it('returns valid:false and errors on failure', () => {
    const result = validate(messageSchema, { content: '' });
    expect(result.valid).toBe(false);
    expect(result.data).toBeNull();
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });
});
