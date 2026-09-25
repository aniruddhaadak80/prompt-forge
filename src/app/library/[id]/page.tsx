import { redirect } from "next/navigation";

type Context = { params: Promise<{ id: string }> };

export default async function LibraryDetailPage({ params }: Context) {
  const { id } = await params;
  redirect(`/build/${id}`);
}
