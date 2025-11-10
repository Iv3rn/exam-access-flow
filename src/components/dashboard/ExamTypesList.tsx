import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddExamTypeDialog from "./AddExamTypeDialog";

interface ExamType {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

interface ExamTypesListProps {
  onUpdate: () => void;
}

const ExamTypesList = ({ onUpdate }: ExamTypesListProps) => {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ExamType | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExamTypes();
  }, []);

  const fetchExamTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exam_types")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar tipos de exame",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setExamTypes(data || []);
    }
    setLoading(false);
  };

  const handleDeleteClick = (examType: ExamType) => {
    setTypeToDelete(examType);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;

    const { error } = await supabase
      .from("exam_types")
      .delete()
      .eq("id", typeToDelete.id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Tipo de exame excluído",
      description: "O tipo de exame foi removido com sucesso.",
    });

    setDeleteDialogOpen(false);
    setTypeToDelete(null);
    fetchExamTypes();
    onUpdate();
  };

  const handleAddSuccess = () => {
    fetchExamTypes();
    onUpdate();
  };

  if (loading) {
    return <div>Carregando tipos de exames...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tipos de Exames</CardTitle>
              <CardDescription>Gerencie os tipos de exames disponíveis no sistema</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examTypes.map((examType) => (
                <TableRow key={examType.id}>
                  <TableCell className="font-medium">{examType.name}</TableCell>
                  <TableCell>
                    <Badge variant={examType.active ? "default" : "secondary"}>
                      {examType.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(examType.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(examType)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo de exame{" "}
              <strong>{typeToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddExamTypeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />
    </>
  );
};

export default ExamTypesList;
