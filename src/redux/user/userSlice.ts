import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export type UserData = {
  gravatar: string;
  id: number;
  name: string;
};

export interface userState {
  loading: boolean;
  user: UserData | null;
  session_id: string | null;
  error: string | null;
}

const initialState: userState = {
  loading: false,
  user: null,
  session_id: null,
  error: null,
};

export const userLogin = createAsyncThunk("user/loginUser", async () => {
  const params = {
    api_key: import.meta.env.VITE_APP_API_KEY,
  };

  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/authentication/token/new",
      { params }
    );
    const request_token = response.data.request_token;

    if (request_token) {
      const validateResponse = await axios.post(
        "https://api.themoviedb.org/3/authentication/token/validate_with_login",
        {
          username: import.meta.env.VITE_APP_USERNAME,
          password: import.meta.env.VITE_APP_PASSWORD,
          request_token,
        },
        { params }
      );
      const validated_token = validateResponse.data.request_token;

      if (validated_token) {
        const sessionResponse = await axios.post(
          "https://api.themoviedb.org/3/authentication/session/new",
          { request_token: validated_token },
          { params }
        );
        return sessionResponse.data.session_id;
      } else {
        throw new Error("Request token not validated.");
      }
    } else {
      throw new Error("No request token found.");
    }
  } catch (error) {
    console.log(error);
    return error;
  }
});

export const getUserDetails = createAsyncThunk(
  "user/getUserDetails",
  async ({ session_id }: { session_id: string }) => {
    const params = {
      api_key: import.meta.env.VITE_APP_API_KEY,
      session_id,
    };

    try {
      const response = await axios.get("https://api.themoviedb.org/3/account", {
        params,
      });
      const { avatar, id, name } = response.data;
      const data = {
        gravatar: avatar.gravatar.hash,
        id,
        name,
      };
      return data;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
);

export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async ({ session_id }: { session_id: string }) => {
    const params = {
      api_key: import.meta.env.VITE_APP_API_KEY,
      session_id,
    };

    try {
      const response = await axios.delete(
        "https://api.themoviedb.org/3/authentication/session",
        {
          params,
        }
      );
      return response.data.success;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(userLogin.pending, (state) => {
        state.loading = true;
      })
      .addCase(userLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.session_id = action.payload;
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error during login.";
      });
    builder
      .addCase(getUserDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'object' && action.payload !== null) {
          state.user = action.payload as UserData;
        } else {
          state.user = null;
        }
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Error during fetching user details.";
      });
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session_id = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error during logout.";
      });
  },
});

export default userSlice.reducer;
