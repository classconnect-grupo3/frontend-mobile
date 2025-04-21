import { client } from '@/lib/http';

export async function fetchUserData(token: string) {
  const response = await client.get('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.data;
}