import { client } from "@/lib/http";

export async function fetchUserData() {
    const response = await client.get('/users/me');
    return response.data; // we do not throw error, error is catched and handled in the profile.tsx file
  }