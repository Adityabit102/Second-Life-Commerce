const KEY = 'slc_prefs'

export function getPreferences() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function trackInterest(category, grade) {
  if (!category && !grade) return
  const prefs = getPreferences()
  if (!prefs.categories) prefs.categories = {}
  if (!prefs.grades) prefs.grades = {}
  if (category) prefs.categories[category] = (prefs.categories[category] || 0) + 1
  if (grade) prefs.grades[grade] = (prefs.grades[grade] || 0) + 1
  try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch {}
}

export function hasPreferences() {
  const p = getPreferences()
  return Object.keys(p.categories || {}).length > 0
}

export function rankListings(listings, getCategoryFn) {
  const prefs = getPreferences()
  if (!prefs.categories && !prefs.grades) return listings
  return [...listings].sort((a, b) => {
    const catA = getCategoryFn(a.product_name)
    const catB = getCategoryFn(b.product_name)
    const scoreA = (prefs.categories?.[catA] || 0) * 3 + (prefs.grades?.[a.grade] || 0)
    const scoreB = (prefs.categories?.[catB] || 0) * 3 + (prefs.grades?.[b.grade] || 0)
    return scoreB - scoreA
  })
}

export function topPreferredCategory() {
  const prefs = getPreferences()
  const cats = prefs.categories || {}
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]
  return top?.[0] ?? null
}
