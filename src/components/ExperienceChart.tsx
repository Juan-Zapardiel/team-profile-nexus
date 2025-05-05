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
  XAxis, 
  YAxis 
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
      .map(([industry, values]) => {
        const colorClass = getIndustryColor(industry as Industry);
        // Convert Tailwind color classes to hex colors
        const colorMap: Record<string, string> = {
          "bg-blue-400": "#60a5fa",
          "bg-green-400": "#4ade80",
          "bg-purple-400": "#c084fc",
          "bg-orange-400": "#fb923c",
          "bg-pink-400": "#f472b6",
          "bg-yellow-400": "#facc15",
          "bg-teal-400": "#2dd4bf",
          "bg-indigo-400": "#818cf8",
          "bg-gray-400": "#9ca3af"
        };
        return {
          name: industry,
          value: values[dataType],
          color: colorMap[colorClass] || "#9ca3af"
        };
      });
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
    if (type === "industry") {
      // Always use pie chart for industries
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
              label={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border rounded shadow-sm">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm">Projects: {data.value}</p>
                      <p className="text-sm">Months: {metrics.byIndustry[data.name as Industry].months}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ 
                fontSize: '12px', 
                paddingLeft: '5px',
                marginLeft: '-5px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    } else {
      // Always use vertical bar chart for project types
      return (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <XAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border rounded shadow-sm">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm">Projects: {data.value}</p>
                      <p className="text-sm">Months: {metrics.byType[data.name as ProjectType].months}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" fill="#3b82f6" label={{ position: 'top', fill: '#000000' }}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#3b82f6" />
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
