import { UserRole } from "src/application/repositories/auth.repository";

/**
 * Type representing all possible user permissions in the system.
 */
export type TUserPermissions = "server.health";

/**
 * Mapping of permissions to the roles that are allowed to perform them.
 */
export const UserPermissions: Record<TUserPermissions, UserRole[]> = {
	/** Permission to access server health information */
	"server.health": ["Admin", "User"]
};
