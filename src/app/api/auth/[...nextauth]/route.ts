import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
