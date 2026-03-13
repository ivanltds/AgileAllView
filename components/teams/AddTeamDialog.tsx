"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

interface AddTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onTeamAdded: () => void;
}

export default function AddTeamDialog({ open, onClose, onTeamAdded }: AddTeamDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    project: "",
    teamId: "",
    areaPath: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from("teams").insert({
      name: formData.name,
      organization: formData.organization,
      project: formData.project,
      team_id: formData.teamId,
      area_path: formData.areaPath,
    });

    setIsLoading(false);

    if (error) {
      alert("Error adding team: " + error.message);
      return;
    }

    setFormData({
      name: "",
      organization: "",
      project: "",
      teamId: "",
      areaPath: "",
    });

    onTeamAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            Configure your Azure DevOps team settings
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="mycompany"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Input
                id="project"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                placeholder="MyProject"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamId">Team ID</Label>
              <Input
                id="teamId"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                placeholder="team-guid"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaPath">Area Path</Label>
              <Input
                id="areaPath"
                value={formData.areaPath}
                onChange={(e) => setFormData({ ...formData, areaPath: e.target.value })}
                placeholder="MyProject\\Team"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
