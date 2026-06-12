import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

interface Todo {
  id: string | number;
  name: string;
}

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data } = await supabase.from('todos').select()
  const todos = data as Todo[] | null;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-card border border-card-border rounded-3xl shadow-lg">
      <h1 className="text-xl font-bold mb-4 text-foreground">Supabase Todos</h1>
      <ul className="space-y-2">
        {todos && todos.length > 0 ? (
          todos.map((todo) => (
            <li key={todo.id} className="p-3 bg-muted-bg/50 border border-border-brand rounded-2xl text-foreground text-sm font-semibold">
              {todo.name}
            </li>
          ))
        ) : (
          <p className="text-sm text-muted-txt">No todos found or &quot;todos&quot; table is empty.</p>
        )}
      </ul>
    </div>
  )
}
