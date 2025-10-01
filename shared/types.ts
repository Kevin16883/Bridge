import { User } from "./schema";

export type PublicUser = Omit<User, "password">;
