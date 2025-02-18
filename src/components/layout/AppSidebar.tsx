
import { Home, Mail, Bookmark, Users, Mic, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useNavigate } from 'react-router-dom'

const navigationItems = [
  {
    title: "Home",
    path: "/",
    icon: Home,
  },
  {
    title: "Messages",
    path: "/inbox-0",
    icon: Mail,
  },
  {
    title: "Saved",
    path: "/saved",
    icon: Bookmark,
  },
  {
    title: "Contacts",
    path: "/contacts",
    icon: Users,
  },
  {
    title: "Voice Message",
    path: "/microphone",
    icon: Mic,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const navigate = useNavigate()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
