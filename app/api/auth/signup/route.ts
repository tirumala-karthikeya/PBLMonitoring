import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["regional_director", "school_admin", "donor"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body?.role === "string" ? body.role : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!fullName || !email || !VALID_ROLES.includes(role) || password.length < 12) {
    return NextResponse.json(
      { error: "Please provide a name, organization email, valid role, and a password of at least 12 characters." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { fullName, email, role, passwordHash },
  });

  return NextResponse.json({ ok: true });
}
