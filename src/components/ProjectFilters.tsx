import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Industry, ProjectType, HumaticaTool, Project } from "@/types";
import { getIndustryColor, getProjectTypeColor } from "@/lib/utils";
import { X, Search, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ProjectFiltersProps {
  projects: Project[];
  onFilterChange: (filters: {
    search: string;
    industries: string[];
    types: string[];
    tools: HumaticaTool[];
    years: string[];
  }) => void;
}

export function ProjectFilters({ projects, onFilterChange }: ProjectFiltersProps) {
  const [search, setSearch] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<HumaticaTool[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // Extract unique values for filters
  const industries = Array.from(new Set(projects.map(p => p.industry)));
  const types = Array.from(new Set(projects.map(p => p.type)));
  const tools = Array.from(new Set(projects.flatMap(p => p.tools).filter(t => t !== "none"))) as HumaticaTool[];
  const years = Array.from(new Set(projects.map(p => new Date(p.startDate).getFullYear()))).sort((a, b) => b - a);

  useEffect(() => {
    onFilterChange({
      search,
      industries: selectedIndustries,
      types: selectedTypes,
      tools: selectedTools,
      years: selectedYears,
    });
  }, [search, selectedIndustries, selectedTypes, selectedTools, selectedYears]);

  const toggleFilter = (filter: string | HumaticaTool, type: "industry" | "type" | "tool" | "year") => {
    const setter = {
      industry: setSelectedIndustries,
      type: setSelectedTypes,
      tool: setSelectedTools,
      year: setSelectedYears,
    }[type];

    setter(prev => 
      prev.includes(filter as any) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter as any]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedIndustries([]);
    setSelectedTypes([]);
    setSelectedTools([]);
    setSelectedYears([]);
  };

  const hasActiveFilters = search || 
    selectedIndustries.length > 0 || 
    selectedTypes.length > 0 || 
    selectedTools.length > 0 || 
    selectedYears.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Industries
              {selectedIndustries.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedIndustries.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {industries.map((industry) => (
              <DropdownMenuCheckboxItem
                key={industry}
                checked={selectedIndustries.includes(industry)}
                onCheckedChange={() => toggleFilter(industry, "industry")}
              >
                {industry}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Project Types
              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedTypes.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {types.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => toggleFilter(type, "type")}
              >
                {type}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Tools
              {selectedTools.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedTools.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {tools.map((tool) => (
              <DropdownMenuCheckboxItem
                key={tool}
                checked={selectedTools.includes(tool)}
                onCheckedChange={() => toggleFilter(tool, "tool")}
              >
                {tool}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Years
              {selectedYears.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedYears.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {years.map((year) => (
              <DropdownMenuCheckboxItem
                key={year}
                checked={selectedYears.includes(year.toString())}
                onCheckedChange={() => toggleFilter(year.toString(), "year")}
              >
                {year}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 