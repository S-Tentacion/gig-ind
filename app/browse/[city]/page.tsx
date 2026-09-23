import { notFound } from "next/navigation";
import { BrowseCompanionsPage } from "@/components/browse-companions-page";

const cities: Record<string, string> = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru", hyderabad: "Hyderabad", pune: "Pune", goa: "Goa", chennai: "Chennai", kolkata: "Kolkata" };

export default async function CityBrowsePage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cityName = cities[city.toLowerCase()];
  if (!cityName) notFound();
  return <BrowseCompanionsPage initialCity={cityName} />;
}
