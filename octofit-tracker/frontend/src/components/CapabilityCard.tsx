import { useEffect, useState, type Key, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  loadItems: () => Promise<T[]>;
  emptyText: string;
  itemKey: (item: T, index: number) => Key;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, loadItems, emptyText, itemKey, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    loadItems()
      .then((records) => {
        if (isCurrent) setItems(records);
      })
      .catch(() => {
        if (isCurrent) setHasError(true);
      });
    return () => {
      isCurrent = false;
    };
  }, [loadItems]);

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
