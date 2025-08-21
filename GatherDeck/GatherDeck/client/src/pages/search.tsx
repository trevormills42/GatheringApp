import { CardSearch } from "@/components/card-search";

export default function Search() {
  return (
    <CardSearch
      isOpen={true}
      onClose={() => window.history.back()}
    />
  );
}
