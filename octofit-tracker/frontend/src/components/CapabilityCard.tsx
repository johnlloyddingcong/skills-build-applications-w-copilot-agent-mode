import { useEffect, useState, type Key, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  resourceKey: string;
  emptyText: string;
  itemKey: (item: T, index: number) => Key;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, resourceKey, emptyText, itemKey, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getJson<Record<string, unknown>>(path)
      .then((payload) => {
        const records = payload[resourceKey];
        if (!Array.isArray(records)) throw new Error('Unexpected API response');
        if (isCurrent) setItems(records as T[]);
      })
      .catch(() => {
        if (isCurrent) setHasError(true);
      });
    return () => {
      isCurrent = false;
    };
  }, [path, resourceKey]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {hasError ? (
          <p className="text-danger mb-0" role="alert">Unable to load {title.toLowerCase()}. Please try again later.</p>
        ) : items === null ? (
          <p className="mb-0" role="status" aria-live="polite">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p className="mb-0" role="status">{emptyText}</p>
        ) : (
          <ul className="list-group list-group-flush">
            {items.map((item, index) => (
              <li className="list-group-item px-0" key={itemKey(item, index)}>{renderItem(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
