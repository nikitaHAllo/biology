import {
  Title,
  Text,
  Group,
  ThemeIcon,
  SegmentedControl,
  Stack,
  Card,
  Badge,
  Checkbox,
  Button,
  Divider,
  SimpleGrid,
} from "@mantine/core";
import {
  IconDownload,
  IconFileDescription,
} from "@tabler/icons-react";
import type { DownloadableTask } from "../../models";

interface Collection {
  id: number | string;
  title: string;
  description?: string;
  download_url?: string | null;
}

interface TasksSectionProps {
  tasks: DownloadableTask[];
  collections: Collection[];
  selected: Set<number>;
  taskFilter: string;
  setTaskFilter: (value: string) => void;
  toggle: (id: number) => void;
  bulk: () => void;
}

export function TasksSection({
  tasks,
  collections,
  selected,
  taskFilter,
  setTaskFilter,
  toggle,
  bulk,
}: TasksSectionProps) {
  return (
    <section>
      <Group justify="space-between" mb="sm">
        <div>
          <Title order={2}>Задания для скачивания</Title>
          <Text c="dimmed">Соберите задания в один архив</Text>
        </div>
        <ThemeIcon size="xl" radius="md" color="blue">
          <IconDownload size={24} />
        </ThemeIcon>
      </Group>

      <SegmentedControl
        value={taskFilter}
        onChange={setTaskFilter}
        data={[
          { label: "Все", value: "all" },
          { label: "ЕГЭ", value: "ege" },
          { label: "ФИПИ", value: "fipi" },
          { label: "Другие", value: "other" },
        ]}
      />

      <Stack gap="md" mt="md">
        {tasks.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            Заданий пока нет
          </Text>
        )}
        {tasks.map((task) => (
          <Card key={task.id} withBorder radius="md" padding="md" shadow="xs">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Group gap="xs" mb={4}>
                  <Badge color="blue" variant="light">
                    {task.source?.toUpperCase()}
                  </Badge>
                  <Badge color="gray" variant="outline" size="sm">
                    {task.file_type?.toUpperCase()}
                  </Badge>
                  {task.year && (
                    <Text size="xs" c="dimmed">
                      {task.year}
                    </Text>
                  )}
                </Group>
                <Text fw={600} mb={task.description ? 2 : 0}>
                  {task.title}
                </Text>
                {task.description && (
                  <Text size="sm" c="dimmed">
                    {task.description}
                  </Text>
                )}
                {task.subject && (
                  <Text size="xs" c="dimmed" mt={2}>
                    {task.subject}
                  </Text>
                )}
              </div>

              <Stack gap="xs" align="flex-end" style={{ flexShrink: 0 }}>
                <Checkbox
                  label="В пакет"
                  checked={selected.has(task.id)}
                  onChange={() => toggle(task.id)}
                />
                <Button
                  size="xs"
                  variant="light"
                  component="a"
                  href={task.file_url}
                  target="_blank"
                >
                  Скачать
                </Button>
              </Stack>
            </Group>
          </Card>
        ))}
      </Stack>

      <Group justify="space-between" mt="md">
        <Button
          leftSection={<IconDownload size={16} />}
          color="teal"
          onClick={bulk}
          disabled={selected.size === 0}
        >
          Скачать одним файлом ({selected.size})
        </Button>
      </Group>

      <Divider my="lg" label="Готовые подборки" />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {collections.map((collection) => (
          <Card
            key={collection.id}
            withBorder
            radius="md"
            padding="lg"
            shadow="sm"
          >
            <Stack gap="xs">
              <Group gap="xs">
                <ThemeIcon variant="light" color="grape">
                  <IconFileDescription size={18} />
                </ThemeIcon>
                <Text fw={600}>{collection.title}</Text>
              </Group>
              {collection.description && (
                <Text size="sm" c="dimmed">
                  {collection.description}
                </Text>
              )}
              <Button
                variant="filled"
                color="grape"
                leftSection={<IconDownload size={16} />}
                component="a"
                href={collection.download_url ?? undefined}
                target="_blank"
                disabled={!collection.download_url}
              >
                Скачать коллекцию
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </section>
  );
}
