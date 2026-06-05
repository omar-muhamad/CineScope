import axios from "axios";

export const checkBookmarked = async ({ id }: { id: number }) => {
  const params = {
    api_key: import.meta.env.VITE_APP_API_KEY,
  };
  const response = await axios.get(
    `https://api.themoviedb.org/3/list/8299412/item_status`,
    {
      params: {
        ...params,
        movie_id: id,
      },
    }
  );
  return response.data.item_present;
};