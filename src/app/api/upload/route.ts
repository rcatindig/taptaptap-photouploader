import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("❌ No file in formData");
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${crypto.randomUUID()}.jpg`;

    const { error } = await supabase.storage
      .from("photos")
      .upload(filename, buffer, { contentType: "image/jpeg" });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage
      .from("photos")
      .getPublicUrl(filename);

    await db.photo.create({
      data: { url: data.publicUrl },
    });

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
    });
  } catch (err) {
    console.error("🔥 API CRASH:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
