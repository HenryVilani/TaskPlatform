import { UserRole } from "src/application/repositories/auth.repository"

export type TUserPermissions = "server.health"

export const UserPermissions: Record<TUserPermissions, UserRole[]> = {

	"server.health": ["Admin", "User"]

}
