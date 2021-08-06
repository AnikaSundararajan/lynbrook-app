import { useEffect } from "react";
import { useSWRInfinite } from "swr";
import useSWRNative, { useSWRNativeRevalidate } from "swr-react-native";
import { useAuth } from "../../components/AuthProvider";
import { apiPath } from "../utils";
import { Organization, Post, Prize, Schedule, User } from "./models";

export type Error = {
  status: number;
};

export type PaginatedResponse<T> = {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
};

export const apiFetcher = (token: string) => async (url: string) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (!res.ok) {
    const error = await res.json();
    error.status = res.status;
    throw error;
  }

  return await res.json();
};

const useAPIRequest = <T>(path: string) => {
  const { signOut, state } = useAuth();
  const { token } = state;

  const ret = useSWRNative<T, Error>(apiPath(path).toString(), apiFetcher(token ?? ""));
  const loggedOut = ret.error && ret.error.status == 401;

  useEffect(() => {
    if (loggedOut) {
      signOut();
    }
  }, [loggedOut]);

  return ret;
};

const useAPIRequestInfinite = <T>(path: string) => {
  const getKey = (_: number, previous: PaginatedResponse<T> | null) => {
    if (previous) return previous.next ?? null;
    return apiPath(path).toString();
  };

  const { signOut, state } = useAuth();
  const { token } = state;

  const ret = useSWRInfinite<PaginatedResponse<T>, Error>(getKey, apiFetcher(token ?? ""));
  const loggedOut = ret.error && ret.error.status == 401;

  useEffect(() => {
    if (loggedOut) {
      signOut();
    }
  }, [loggedOut]);

  useSWRNativeRevalidate(ret);
  return ret;
};

export const useUser = () => useAPIRequest<User>("/auth/users/me/");
export const useOrgs = () => useAPIRequestInfinite<Organization>("/orgs/");
export const useEvents = () => useAPIRequestInfinite<Event>("/events/");
export const usePrizes = () => useAPIRequestInfinite<Prize>("/prizes/");

export const usePosts = () => useAPIRequestInfinite<Post>("/posts/");
export const usePost = (id: number) => useAPIRequest<Post>(`/posts/${id}/`);

export const useSchedules = () => useAPIRequestInfinite<Schedule>("/schedules/");
export const useCurrentSchedule = () => useAPIRequest("/schedules/current/");
