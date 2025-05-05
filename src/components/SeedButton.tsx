
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { seedDatabase } from "@/lib/seedDatabase";
import { useToast } from "@/components/ui/use-toast";

export function SeedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      const result = await seedDatabase();
      
      if (result.success) {
        toast({
          title: "Database seeded successfully",
          description: "Sample projects have been added and assigned to team members",
        });
      } else {
        toast({
          title: "Error seeding database",
          description: "Check console for more details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        title: "Error seeding database",
        description: "Check console for more details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSeed} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Seeding Database...
        </>
      ) : (
        "Seed Database with Sample Projects"
      )}
    </Button>
  );
}
