/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_analyzeReport from "../actions/analyzeReport.js";
import type * as actions_configureSupermemory from "../actions/configureSupermemory.js";
import type * as actions_generateSharedContext from "../actions/generateSharedContext.js";
import type * as actions_summarizeSession from "../actions/summarizeSession.js";
import type * as mutations_appointments from "../mutations/appointments.js";
import type * as mutations_reports from "../mutations/reports.js";
import type * as mutations_sessions from "../mutations/sessions.js";
import type * as mutations_sharedContexts from "../mutations/sharedContexts.js";
import type * as queries_appointments from "../queries/appointments.js";
import type * as queries_doctors from "../queries/doctors.js";
import type * as queries_patients from "../queries/patients.js";
import type * as queries_reports from "../queries/reports.js";
import type * as queries_sessions from "../queries/sessions.js";
import type * as queries_sharedContexts from "../queries/sharedContexts.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/analyzeReport": typeof actions_analyzeReport;
  "actions/configureSupermemory": typeof actions_configureSupermemory;
  "actions/generateSharedContext": typeof actions_generateSharedContext;
  "actions/summarizeSession": typeof actions_summarizeSession;
  "mutations/appointments": typeof mutations_appointments;
  "mutations/reports": typeof mutations_reports;
  "mutations/sessions": typeof mutations_sessions;
  "mutations/sharedContexts": typeof mutations_sharedContexts;
  "queries/appointments": typeof queries_appointments;
  "queries/doctors": typeof queries_doctors;
  "queries/patients": typeof queries_patients;
  "queries/reports": typeof queries_reports;
  "queries/sessions": typeof queries_sessions;
  "queries/sharedContexts": typeof queries_sharedContexts;
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
