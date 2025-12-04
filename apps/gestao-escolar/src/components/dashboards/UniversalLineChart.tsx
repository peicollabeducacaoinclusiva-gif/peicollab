import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

interface UniversalLineChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  series: Array<{
    key: string;
    label: string;
    color?: string;
  }>;
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}

export function UniversalLineChart({
  data,
  dataKey,
  series,
  title,
  description,
  height = 300,
  className,
}: UniversalLineChartProps) {
  const chartConfig: ChartConfig = series.reduce((acc, s) => {
    acc[s.key] = {
      label: s.label,
      color: s.color || `hsl(var(--chart-${series.indexOf(s) + 1}))`,
    };
    return acc;
  }, {} as ChartConfig);

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={dataKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (typeof value === 'string' && value.length > 10) {
                  return value.slice(0, 10) + '...';
                }
                return String(value);
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={60}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {series.map((s, index) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color || `hsl(var(--chart-${index + 1}))`}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
