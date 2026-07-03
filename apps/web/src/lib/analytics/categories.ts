import type { CategoryWithColor, TxnAmount } from '@/types/database'

const FALLBACK_COLOR = '#6B7280'
const UNGROUPED = 'Others'

export interface CategoryChild {
  name: string
  value: number
  color: string
}

export interface CategorySlice {
  name: string
  value: number
  color: string
  children: CategoryChild[]
}

/**
 * Expense transactions grouped into parent categories, biggest total first.
 *
 * Children are keyed by category id, not by name: two categories can share a
 * name under different parents ("Kopi" under Makan and under Transport), and
 * keying by name collapsed them into one slice.
 */
export function buildExpenseChart(
  txns: TxnAmount[],
  categories: CategoryWithColor[],
): CategorySlice[] {
  const byId = new Map(categories.map(c => [c.id, c]))

  // A category with no parent is its own parent, so top-level categories
  // produce a single row rather than disappearing.
  const parentNameOf = (categoryId: string): string => {
    const cat = byId.get(categoryId)
    if (!cat) return UNGROUPED
    return byId.get(cat.parent_id || cat.id)?.name || cat.name
  }
  const colorOf = (categoryId: string): string => byId.get(categoryId)?.color || FALLBACK_COLOR

  interface Builder {
    name: string
    value: number
    color: string
    children: CategoryChild[]
    byChildId: Map<string, CategoryChild>
  }
  const builders = new Map<string, Builder>()

  for (const t of txns) {
    if (t.type !== 'expense') continue

    const amount = Number(t.amount)
    const parentName = t.category_id ? parentNameOf(t.category_id) : UNGROUPED
    const childName = (t.category_id && byId.get(t.category_id)?.name) || parentName
    const childId = t.category_id || UNGROUPED

    let builder = builders.get(parentName)
    if (!builder) {
      builder = { name: parentName, value: 0, color: FALLBACK_COLOR, children: [], byChildId: new Map() }
      builders.set(parentName, builder)
    }
    builder.value += amount

    let child = builder.byChildId.get(childId)
    if (!child) {
      child = { name: childName, value: 0, color: colorOf(childId) }
      builder.byChildId.set(childId, child)
      builder.children.push(child)
    }
    child.value += amount
  }

  return [...builders.values()]
    .sort((a, b) => b.value - a.value)
    .map(builder => {
      const children = [...builder.children].sort((a, b) => b.value - a.value)
      return {
        name: builder.name,
        value: builder.value,
        color: children[0]?.color ?? FALLBACK_COLOR,
        children,
      }
    })
}

export function flattenChildren(slices: CategorySlice[]): CategoryChild[] {
  return slices.flatMap(s => s.children)
}
