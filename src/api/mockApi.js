// Simulated latency
const DELAY = 800;

// Helper to simulate network requests
const mockNetwork = (data, shouldFail = false) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Network request failed'));
      } else {
        resolve(data);
      }
    }, DELAY);
  });
};

// Seed data
let drafts = [
  {
    id: '1',
    title: 'First Draft',
    content: 'This is the initial draft content. It feels good to start writing.',
    media: [],
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Video Idea',
    content: 'An idea about a new tutorial series.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
        type: 'image/jpeg',
        name: 'coding.jpg'
      }
    ],
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  }
];

export const fetchDrafts = () => {
  return mockNetwork([...drafts]);
};

export const saveDraft = (draft) => {
  return mockNetwork(draft).then(() => {
    if (draft.id) {
      drafts = drafts.map(d => (d.id === draft.id ? { ...draft, updatedAt: new Date().toISOString() } : d));
    } else {
      const newDraft = { ...draft, id: Date.now().toString(), updatedAt: new Date().toISOString() };
      drafts.unshift(newDraft);
      return newDraft;
    }
    return draft;
  });
};

export const deleteDraft = (id) => {
  return mockNetwork(id).then(() => {
    drafts = drafts.filter(d => d.id !== id);
    return id;
  });
};

export const uploadMedia = (file) => {
  // Simulate an upload delay and return a local object URL
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!file) {
        reject(new Error('No file provided'));
      } else {
        const objectUrl = URL.createObjectURL(file);
        resolve({
          url: objectUrl,
          type: file.type,
          name: file.name
        });
      }
    }, 1500); // media upload takes a bit longer
  });
};

// Mock Auth
export const loginUser = (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ token: 'mock-jwt-token', user: { email } });
    }, 1200);
  });
};
