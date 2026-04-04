import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/products?brand=${slug}`);
}
