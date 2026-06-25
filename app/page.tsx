"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

// The form schema
const formSchema = z.object({
  budget: z.number().min(500000, "Budget must be at least 5 Lakhs").max(50000000, "Max budget is 5 Crores"),
  type: z.string().optional(),
  fuel: z.string().optional(),
  seatingMin: z.number().optional(),
  usage: z.enum(["city", "highway", "mixed"]).optional(),
});

export default function Home() {
  const router = useRouter();
  const { searchFilters, setSearchFilters } = useAppStore();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budget: searchFilters.budget || 5000000,
      type: searchFilters.type || "",
      fuel: searchFilters.fuel || "",
      seatingMin: searchFilters.seatingMin || 5,
      usage: searchFilters.usage || "mixed",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setSearchFilters(values);
    // Move to results page where fetching will happen
    router.push("/results");
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8 border border-slate-100">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Find Your Perfect Vehicle in Nepal
        </h1>
        <p className="text-slate-500 mb-8 text-lg">
          Tell us your budget and preferences. Our AI will calculate real on-road taxes and recommend the best cars for you.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="font-semibold text-slate-700">Budget (NPR)</label>
            <input 
              type="number" 
              {...form.register("budget", { valueAsNumber: true })} 
              className="w-full p-3 border rounded-lg bg-slate-50"
            />
            {form.formState.errors.budget && (
              <p className="text-red-500 text-sm">{form.formState.errors.budget.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-semibold text-slate-700">Body Type</label>
              <select {...form.register("type")} className="w-full p-3 border rounded-lg bg-slate-50">
                <option value="">Any Type</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Electric">Electric (EV)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700">Fuel Preference</label>
              <select {...form.register("fuel")} className="w-full p-3 border rounded-lg bg-slate-50">
                <option value="">Any Fuel</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="font-semibold text-slate-700">Primary Usage</label>
              <select {...form.register("usage")} className="w-full p-3 border rounded-lg bg-slate-50">
                <option value="mixed">Mixed (City & Highway)</option>
                <option value="city">Mainly City (Traffic)</option>
                <option value="highway">Mainly Highway/Long Trips</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700">Minimum Seating</label>
              <input 
                type="number" 
                {...form.register("seatingMin", { valueAsNumber: true })} 
                className="w-full p-3 border rounded-lg bg-slate-50"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-14 text-lg mt-4 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? "Finding Vehicles..." : "Get Recommendations"}
          </Button>
        </form>
      </div>
    </main>
  );
}
