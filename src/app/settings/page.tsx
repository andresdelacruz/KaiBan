import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Board Settings</h1>
      <Tabs defaultValue="columns">
        <TabsList>
          <TabsTrigger value="columns">Columns</TabsTrigger>
          <TabsTrigger value="lanes">Lanes</TabsTrigger>
          <TabsTrigger value="fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>Manage Columns</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Column management UI will be here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lanes">
           <Card>
            <CardHeader>
              <CardTitle>Manage Lanes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Lane management UI will be here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="fields">
           <Card>
            <CardHeader>
              <CardTitle>Manage Custom Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Custom field management UI will be here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Manage Card Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Template management UI will be here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Manage Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Member management UI will be here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
