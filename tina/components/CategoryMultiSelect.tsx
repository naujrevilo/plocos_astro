// @ts-nocheck
// Custom multi-select that pulls categories via Tina GraphQL so the panel shows live options.
import React, { useEffect, useMemo, useState } from "react";
import { wrapFieldsWithMeta, useCMS } from "tinacms";

const emptyList: string[] = [];

const QUERY = /* GraphQL */ `
  query TinaCategoriesList($first: Float = 200) {
    categoriesConnection(first: $first) {
      edges {
        node {
          _sys {
            filename
          }
          title
        }
      }
    }
  }
`;

const CategoryMultiSelectInner = ({ input, meta }) => {
  const cms = useCMS();
  const [options, setOptions] = useState(emptyList);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      if (!cms?.api?.tina) {
        console.warn("[tina] API de Tina no disponible, no se puede cargar el listado de categorías");
        setStatus("error");
        return;
      }

      try {
        setStatus("loading");
        const response = await cms.api.tina.request(QUERY, { first: 200 });
        if (cancelled) return;
        const edges = response?.categoriesConnection?.edges ?? [];
        const parsed = edges
          .map((edge) => {
            const slug = edge?.node?._sys?.filename;
            const label = edge?.node?.title ?? slug;
            return slug ? { value: slug, label: label ?? slug } : null;
          })
          .filter(Boolean);

        setOptions(parsed.length > 0 ? parsed : emptyList);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("[tina] Error cargando categorías", error);
        setStatus("error");
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [cms]);

  const selected = useMemo(() => {
    if (Array.isArray(input.value)) return input.value;
    if (typeof input.value === "string" && input.value.length > 0) return [input.value];
    return emptyList;
  }, [input.value]);

  const toggleValue = (slug: string) => {
    const next = selected.includes(slug)
      ? selected.filter((value) => value !== slug)
      : [...selected, slug.trim()];
    input.onChange(next.map(v => v.trim()));
  };

  if (status === "loading") {
    return <em>Cargando categorías…</em>;
  }

  if (status === "error") {
    return (
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <em>No se pudieron cargar las categorías desde Tina.</em>
        <small>Verifica que el servidor Tina esté en ejecución.</small>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {options.length === 0 ? (
        <em>No hay categorías definidas.</em>
      ) : (
        options.map((option) => (
          <label
            key={option.value}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <input
              type="checkbox"
              name={`${input.name}.${option.value}`}
              checked={selected.includes(option.value)}
              onChange={() => toggleValue(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))
      )}
      {meta?.touched && meta?.error && (
        <span style={{ color: "var(--tina-color-danger)", fontSize: "0.8rem" }}>{meta.error}</span>
      )}
    </div>
  );
};

export const CategoryMultiSelect = wrapFieldsWithMeta(CategoryMultiSelectInner);
