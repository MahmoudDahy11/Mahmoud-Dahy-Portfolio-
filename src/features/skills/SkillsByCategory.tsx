import { Badge } from '@/components/ui/badge'
import type { SkillWithCategory } from './hooks'

/** A skill name. */
export function SkillItem({ skill }: { skill: SkillWithCategory }) {
  return <li className="text-sm font-medium">{skill.name}</li>
}

/** Groups skills by category, preserving the order categories first appear in. */
function groupByCategory(skills: SkillWithCategory[]) {
  const groups = new Map<string, { label: string; skills: SkillWithCategory[] }>()

  for (const skill of skills) {
    const key = skill.skillCategories?.id ?? 'uncategorised'
    const label = skill.skillCategories?.name ?? 'Other'

    const existing = groups.get(key)
    if (existing) {
      existing.skills.push(skill)
    } else {
      groups.set(key, { label, skills: [skill] })
    }
  }

  return [...groups.values()]
}

/**
 * Skills grouped by category.
 *
 * Uses the category embedded by the query rather than a second request, so grouping costs
 * nothing. A skill with no category is collected under "Other" instead of being dropped:
 * hiding content the owner entered is a worse failure than a slightly untidy group.
 */
export function SkillsByCategory({ skills }: { skills: SkillWithCategory[] }) {
  const groups = groupByCategory(skills)

  return (
    <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
      {groups.map((group) => (
        <section key={group.label} className="space-y-4">
          <h2 className="border-b border-border pb-2 text-xl font-semibold tracking-tight">
            {group.label}
          </h2>
          <ul className="space-y-2.5">
            {group.skills.map((skill) => (
              <SkillItem key={skill.id} skill={skill} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** A flat list of skills as badges, for compact previews. */
export function SkillBadges({ skills }: { skills: SkillWithCategory[] }) {
  if (skills.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <li key={skill.id}>
          <Badge variant="secondary">{skill.name}</Badge>
        </li>
      ))}
    </ul>
  )
}
