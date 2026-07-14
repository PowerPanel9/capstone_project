// Mock user that matches Prisma User model
export const currentUser = {
  id: 1,
  firstName: "Alex",
  lastName: "Rivera",
  imageUrl: null, // Profile picture URL
  email: "alex.rivera@example.com",
  authProvider: "local",
  createdAt: "2023-03-15T10:00:00.000Z",
  bio: "Full-stack engineer and occasional designer with 5+ years building products that people actually enjoy using. I specialize in React ecosystems, GraphQL APIs, and fast-loading web experiences.",
  skills: ["React", "TypeScript", "Node.js", "Figma", "GraphQL"],
  location: "San Francisco, CA",
  resumeUrl: null,
  certificationUrl: null,

  // Computed fields for UI (not in database)
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
  get initials() {
    return `${this.firstName[0]}${this.lastName[0]}`;
  }
};
