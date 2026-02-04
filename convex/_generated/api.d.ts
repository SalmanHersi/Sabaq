/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assignments from "../assignments.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_streaks from "../lib/streaks.js";
import type * as migrations from "../migrations.js";
import type * as parents from "../parents.js";
import type * as progress from "../progress.js";
import type * as quran from "../quran.js";
import type * as sessions from "../sessions.js";
import type * as students from "../students.js";
import type * as teachers from "../teachers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assignments: typeof assignments;
  emails: typeof emails;
  http: typeof http;
  "lib/permissions": typeof lib_permissions;
  "lib/streaks": typeof lib_streaks;
  migrations: typeof migrations;
  parents: typeof parents;
  progress: typeof progress;
  quran: typeof quran;
  sessions: typeof sessions;
  students: typeof students;
  teachers: typeof teachers;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
