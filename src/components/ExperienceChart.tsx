
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  Cell, 
  Legend, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis 
} from "recharts";
import { 
  getIndustryColor, 
  getProjectTypeColor, 
  getToolColor 
} from "@/lib/utils";
import { ExperienceMetrics, Industry, ProjectType, HumaticaTool } from "@/types";

interface ExperienceChartProps {
  metrics: ExperienceMetrics;
  type: "industry" | "projectType" | "tool";
  dataType: "projects" | "months";
}

export function ExperienceChart({ metrics, type, dataType }: ExperienceChartProps) {
  // Prepare data based on chart type
  let data: Array<{ name: string; value: number; color: string }> = [];
  let title = "";
  
  if (type === "industry") {
    title = dataType === "projects" ? "Projects by Industry" : "Experience (Months) by Industry";
    data = Object.entries(metrics.byIndustry)
      .filter(([_, values]) => values[dataType] > 0)
      .map(([industry, values]) => ({
        name: industry,
        value: values[dataType],
        color: getIndustryColor(industry as Industry).replace("bg-", "")
      }));
  } else if (type === "projectType") {
    title = dataType === "projects" ? "Projects by Type" : "Experience (Months) by Project Type";
    data = Object.entries(metrics.byType)
      .filter(([_, values]) => values[dataType] > 0)
      .map(([projectType, values]) => ({
        name: projectType,
        value: values[dataType],
        color: getProjectTypeColor(projectType as ProjectType).replace("bg-", "")
      }));
  } else if (type === "tool") {
    title = dataType === "projects" ? "Projects by Tool" : "Experience (Months) by Tool";
    data = Object.entries(metrics.byTool)
      .filter(([tool, values]) => tool !== "none" && values[dataType] > 0)
      .map(([tool, values]) => ({
        name: tool,
        value: values[dataType],
        color: getToolColor(tool as HumaticaTool).replace("bg-", "")
      }));
  }

  // Sort data by value in descending order
  data = data.sort((a, b) => b.value - a.value);

  const renderChart = () => {
    if (data.length <= 3) {
      // Use pie chart for small datasets
      return (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`var(--${entry.color})`} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} ${dataType}`, '']}
              itemStyle={{ color: '#000' }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    } else {
      // Use bar chart for larger datasets
      return (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" hide />
            <Tooltip 
              formatter={(value) => [`${value} ${dataType}`, '']}
              itemStyle={{ color: '#000' }}
            />
            <Legend />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`var(--${entry.color})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
