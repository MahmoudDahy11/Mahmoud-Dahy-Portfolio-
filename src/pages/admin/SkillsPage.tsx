import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SkillsTable } from '@/features/skills/SkillsTable'
import { SkillCategoriesTable } from '@/features/skills/SkillCategoriesTable'
import { TechnologiesTable } from '@/features/skills/TechnologiesTable'

/**
 * Skills, categories, and technologies.
 *
 * Three related tables on one page rather than three sidebar entries. They are one subject —
 * what you can do and what you build with — and splitting them would mean three pages whose
 * only difference is which table they show. Each tab is still a full CRUD section with its
 * own dialogs, so the behaviour is identical to every other section.
 */
export default function SkillsPage() {
  return (
    <>
      <PageHeader
        title="Skills"
        description="What you work with. Drafts stay hidden from the public site."
      />

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="technologies">Technologies</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="pt-4">
          <SkillsTable />
        </TabsContent>
        <TabsContent value="categories" className="pt-4">
          <SkillCategoriesTable />
        </TabsContent>
        <TabsContent value="technologies" className="pt-4">
          <TechnologiesTable />
        </TabsContent>
      </Tabs>
    </>
  )
}
