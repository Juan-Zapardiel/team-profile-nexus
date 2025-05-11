import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, Bug } from "lucide-react";
import { Project } from "@/types";
import { formatDate } from "@/lib/utils";
import { syncHarvestProjects } from "@/lib/syncHarvestProjects";
import { useToast } from "@/components/ui/use-toast";
import { debugProject } from "@/lib/debugProject";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectDatabaseProps {
  projects: Project[];
  onAddProject: () => void;
  onRefresh: () => void;
}

export const ProjectDatabase = ({ projects, onAddProject, onRefresh }: ProjectDatabaseProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncHarvestProjects();
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        onRefresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync projects",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDebug = async (projectName: string) => {
    try {
      await debugProject(projectName);
      toast({
        title: "Debug Info",
        description: "Check the browser console for project details",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to debug project",
        variant: "destructive",
      });
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = industryFilter === "all" || project.industry === industryFilter;
      const matchesType = typeFilter === "all" || project.type === typeFilter;
      return matchesSearch && matchesIndustry && matchesType;
    });
  }, [projects, searchQuery, industryFilter, typeFilter]);

  const industries = ["all", ...new Set(projects.map(p => p.industry))];
  const types = ["all", ...new Set(projects.map(p => p.type))];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync with Harvest
          </Button>
          <Button onClick={onAddProject}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map(industry => (
              <SelectItem key={industry} value={industry}>
                {industry === "all" ? "All Industries" : industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {types.map(type => (
              <SelectItem key={type} value={type}>
                {type === "all" ? "All Types" : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tools</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{project.industry}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{project.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {project.tools.filter(tool => tool !== "none").map(tool => (
                      <Badge key={tool} variant="outline">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {project.description}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDebug(project.name)}
                  >
                    <Bug className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 