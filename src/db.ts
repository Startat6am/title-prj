import { neon } from "@neondatabase/serverless";
import { requireDatabaseUrl } from "./config.js";

export const sql = neon(requireDatabaseUrl());
