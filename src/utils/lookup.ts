import { useAuth } from "@/providers/AuthProvider";
import { lookupRepository } from "@/repositories/administrationTypesRepository";
import { useMemo } from "react";

export function convertCategoryOptions(id: string): { label: string; value: string } {
  const categories = lookupRepository.categoryLookupItems();
  const category = { label: 'Unknown', value: id };
  categories.then((cats) => {
    category.label = cats.find((c) => String(c.id) === id)?.name ?? 'Unknown';
  }).catch((e) => {
    if (e.message?.includes('403')) {
      useAuth().signOut();
    }
  });
  return category;
}

export function convertAdministrationTypeOptions(id: string): { label: string; value: string } {
  const adminTypes = useResource(() => lookupRepository.administrationLookupItems(), 'administration-types');
  return { label: label, value: id };
}
