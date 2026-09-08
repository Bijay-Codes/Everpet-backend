export type UsersData = {
    id: number;
    name: string;
    email: string;
    password: string | number,
    petInfo?: {
        totalPets: number;
        totalPetsDied: number;
        pets: number[];
    }
}

export interface UserTokens {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    created_at: Date;
}