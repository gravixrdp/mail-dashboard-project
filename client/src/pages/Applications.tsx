import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function Applications() {
  const { data: applications, isLoading } = trpc.applications.list.useQuery({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Applications</h1>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-gray-600 mt-1">Manage all your job applications</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applications && applications.length > 0 ? (
            <div className="space-y-2">
              {applications.map((app) => (
                <div key={app.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{app.hrEmail}</p>
                  <p className="text-sm text-gray-600">{app.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">Status: {app.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No applications yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
