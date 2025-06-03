"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Import,
  SquarePlus,
  Download,
  Copy,
  Ban,
  Search,
  MoreHorizontal,
} from "lucide-react";

// Validation schema using Zod
const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    isSecret: z.boolean(),
    value: z.string().optional(),
    vault: z.string().optional(),
    secret: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.name.includes(" ")) {
      ctx.addIssue({
        path: ["name"],
        message: "Name must not contain spaces",
      });
    }
    if (data.isSecret === false && data.value.length < 1) {
      ctx.addIssue({
        path: ["value"],
        message: "Value is required",
      });
    }
    if (data.isSecret === true && data.vault.length < 1) {
      ctx.addIssue({
        path: ["vault"],
        message: "Vault Name is required",
      });
    }
    if (data.isSecret === true && data.secret.length < 1) {
      ctx.addIssue({
        path: ["secret"],
        message: "Secret Name is required",
      });
    }
  });

const defaultValues = {
  name: "",
  isSecret: false,
  value: "",
  vault: "",
  secret: "",
};

const defaultEdit = {
  id: null,
  isEdit: false,
};

export default function RunTime() {
  const [isOpen, setIsOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const [editHandler, setEditHandler] = useState(defaultEdit);

  const [applicationSettings, setApplicationSettings] = useState("");
  const [toBeImport, setToBeImport] = useState(false);

  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);

  const textareaRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const idGenerator = () => {
    return data.length > 0 ? data[data.length - 1].id : 1;
  };

  const importData = () => {
    try {
      const envPattern = /-(\S+)\s+([^\-]+)/g;
      let match;
      const result = [];
      let idCounter = 1;

      while ((match = envPattern.exec(applicationSettings)) !== null) {
        const [_, name, value] = match;
        // Check if the value is a KeyVault reference
        const isSecretVault = value.startsWith("@Microsoft.KeyVault");

        result.push({
          id: idGenerator() + idCounter++,
          name: name,
          value: value.trim(),
          secret: isSecretVault,
        });
      }

      setData((prevData) => [...prevData, ...result]);
      setConfigOpen(false);
      setApplicationSettings("");
      toast("Environment Variables Loaded Successfully");
    } catch (error) {
      toast("Enter Valid Application Settings");
    }
  };

  const handleDelete = (id) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(textareaRef.current.value)
      .then(() => {
        toast("Settings Copied");
        setConfigOpen(false);
        setApplicationSettings("");
      })
      .catch((err) => {
        toast("Couldn't Copy The Settings");
      });
  };

  const handleEdit = (id) => {
    let editData = data.find((e) => e.id == id);
    console.log("EDIT DATA", editData);
    if (editData.secret) {
      let vaultSecret = editData.value.match(
        /VaultName=(.*?);SecretName=(.*?)\)/
      );
      form.reset({
        name: editData.name,
        isSecret: editData.secret,
        value: "",
        vault: vaultSecret[1], // Condition
        secret: vaultSecret[2], // Condition
      });
    } else {
      form.reset({
        name: editData.name,
        isSecret: editData.secret,
        value: editData.value,
        vault: "",
        secret: "",
      });
    }
    setEditHandler({ id: id, isEdit: true });
    setIsOpen(true);
  };

  const onSubmit = (data) => {
    console.log("Form Data:", data, editHandler.id);
    if (editHandler.isEdit) {
      if (data.isSecret) {
        setData((prev) =>
          prev.map((each) =>
            each.id == editHandler.id
              ? {
                  ...each,
                  name: data.name,
                  secret: data.isSecret,
                  value: `@Microsoft.KeyVault(VaultName=${data.vault};SecretName=${data.secret})`,
                }
              : each
          )
        );
      } else {
        setData((prev) =>
          prev.map((each) =>
            each.id == editHandler.id
              ? {
                  ...each,
                  name: data.name,
                  secret: data.isSecret,
                  value: data.value,
                }
              : each
          )
        );
      }
    } else {
      if (data.isSecret) {
        setData((prev) => [
          ...prev,
          {
            id: idGenerator() + 1,
            name: data.name,
            secret: data.isSecret,
            value: `@Microsoft.KeyVault(VaultName=${data.vault};SecretName=${data.secret})`,
          },
        ]);
      } else {
        setData((prev) => [
          ...prev,
          {
            id: idGenerator() + 1,
            name: data.name,
            secret: data.isSecret,
            value: data.value,
          },
        ]);
      }
    }
    resetAll();
  };

  const onSearch = (data) => {
    let searchData = data.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.value.toLowerCase().includes(search.toLowerCase())
    );
    return searchData;
  };

  const generateConfig = () => {
    let concated = "";
    for (let index = 0; index < data.length; index++) {
      concated += `-${data[index].name} ${data[index].value} `;
    }
    setToBeImport(false);
    setApplicationSettings(concated);
    setConfigOpen(true);
  };

  const setAsImport = () => {
    setToBeImport(true);
    setConfigOpen(true);
  };

  const onConfigClose = () => {
    setConfigOpen(false);
    setApplicationSettings("");
  };

  const resetAll = () => {
    form.reset(defaultValues);
    setIsOpen(false); // Close dialog
    setEditHandler(defaultEdit);
  };

  // useEffect(()=>{
  //   onSearch
  // },[search])

  return (
    <>
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                onChange={(e) => setSearch(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setAsImport()}>
                <Download />
                <span className="hidden sm:inline">
                  Import Application Settings
                </span>
              </Button>
              <Button variant="default" onClick={() => setIsOpen(true)}>
                <SquarePlus />
                <span className="hidden sm:inline">
                  Add Environment Variables
                </span>
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-md border mb-4">
          <Table>
            {data.length > 0 && (
              <TableCaption className="mt-0 py-2 border-t">
                A list of your environment variables.
              </TableCaption>
            )}
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="min-w-[100px]">Value</TableHead>
                <TableHead>Secret</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                onSearch(data).map((row, i) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-center">{i + 1}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="min-w-[100px]">{row.value}</TableCell>
                    <TableCell className="font-medium">
                      <Badge variant="outline">
                        {row.secret ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-center">
                      {/* <Button onClick={() => handleEdit(row.id)}>Edit</Button> */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(row.id)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(row.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    <div className="flex flex-row items-center justify-center">
                      <Ban /> &nbsp;
                      <p className="text-sm text-gray-500">
                        Add or load the variables
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {!!data.length && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setData([])}>
              Clear
            </Button>{" "}
            <Button onClick={() => generateConfig()}>
              Generate Application Settings
            </Button>{" "}
          </div>
        )}
      </div>
      <Dialog open={isOpen} onOpenChange={resetAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Environment Variables</DialogTitle>
            <DialogDescription>
              {editHandler.isEdit ? "Edit Variables" : "Add Variables"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Radio Field */}
              <FormField
                control={form.control}
                name="isSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is This Stored As Secret ?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex items-center"
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <RadioGroupItem value={true} id="yes" />
                        <label htmlFor="yes">Yes</label>

                        <RadioGroupItem
                          value={false}
                          id="no"
                          className="ml-2"
                        />
                        <label htmlFor="no">No</label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditionally Rendered Vault Field */}
              {form.watch("isSecret") === false && (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Conditionally Rendered Vault Field */}
              {form.watch("isSecret") === true && (
                <FormField
                  control={form.control}
                  name="vault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vault Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Vault Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Conditionally Rendered Secret Field */}
              {form.watch("isSecret") === true && (
                <FormField
                  control={form.control}
                  name="secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Secret Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="submit">Submit</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    resetAll();
                  }}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={configOpen} onOpenChange={onConfigClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Settings</DialogTitle>
            <DialogDescription>
              {" "}
              {toBeImport
                ? "Directly Import The Configs To The Table"
                : "Copy The Application Settings By Clicking The Copy Button"}
            </DialogDescription>
          </DialogHeader>
          {/* <Tabs defaultValue="Key Value" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Key Value">Key Value</TabsTrigger>
              <TabsTrigger value="JSON">JSON</TabsTrigger>
            </TabsList>
          </Tabs> */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="config">Configs</Label>
            <Textarea
              placeholder="Enter or paste configs"
              value={applicationSettings}
              id="config"
              ref={textareaRef}
              onChange={(e) => setApplicationSettings(e.target.value)}
              className="min-h-96"
              disabled={!toBeImport}
            />
          </div>
          <DialogFooter>
            {toBeImport ? (
              <Button onClick={importData}>
                <Import /> Import
              </Button>
            ) : (
              <Button onClick={copyToClipboard}>
                <Copy />
                Copy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
