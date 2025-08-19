import { User } from "src/domain/user/user.entity";

/**
 * Interface for user-related repository operations.
 */
export interface IUserRepository {
  /**
   * Creates a new user.
   * @param user The user entity to create.
   * @returns A promise that resolves to the created User.
   */
  create(user: User): Promise<User>;

  /**
   * Updates an existing user.
   * @param user The user entity with updated data.
   * @returns A promise that resolves to the updated User.
   */
  update(user: User): Promise<User>;

  /**
   * Deletes a user.
   * @param user The user entity to delete.
   * @returns A promise that resolves when the user has been deleted.
   */
  delete(user: User): Promise<void>;

  /**
   * Finds a user by their unique identifier.
   * @param id The ID of the user.
   * @returns A promise that resolves to the User if found, or null if not found.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their email address.
   * @param email The email of the user.
   * @returns A promise that resolves to the User if found, or null if not found.
   */
  findByEmail(email: string): Promise<User | null>;
}
