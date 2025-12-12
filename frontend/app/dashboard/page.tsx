"use client"

import { useState, useEffect, Suspense } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useRouter, useSearchParams } from "next/navigation"
import { DeviceRegistrationModal } from "@/components/device-registration-modal"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { MyDetails } from "@/components/dashboard/my-details"
import { MyDevices } from "@/components/dashboard/my-devices"
import { MyAssets } from "@/components/dashboard/my-assets"
import { MyDerivatives } from "@/components/dashboard/my-derivatives"
import { ClaimHistory } from "@/components/dashboard/claim-history"
import { User, Package, Image as ImageIcon, LogOut, Home, Layers, DollarSign } from "lucide-react"

type DashboardView = "details" | "devices" | "assets" | "derivatives" | "claims"

export default function DashboardPage() {
  const { isConnected, disconnectWallet } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentView, setCurrentView] = useState<DashboardView>("details")

  useEffect(() => {
    const view = searchParams.get("view") || searchParams.get("tab")
    if (view && ["details", "devices", "assets", "derivatives", "claims"].includes(view)) {
      setCurrentView(view as DashboardView)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const handleViewChange = (view: DashboardView) => {
    setCurrentView(view)
    router.push(`/dashboard?view=${view}`, { scroll: false })
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#050505] text-white">
        <Sidebar collapsible="icon" className="border-r border-white/10 bg-[#080808]">
          <SidebarHeader className="border-b border-white/5 p-4 group-data-[collapsible=icon]:p-2">
            <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 transition-all duration-300">
              <SidebarTrigger className="text-white/80 hover:bg-white/10 hover:text-white size-9 flex-shrink-0 group-data-[collapsible=icon]:size-8 rounded-lg transition-colors" />
              <span className="font-inter text-lg font-medium tracking-tight group-data-[collapsible=icon]:hidden opacity-100 transition-opacity duration-300">
                My Dashboard
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="pt-6 px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 text-white/40 uppercase tracking-widest text-[10px] font-semibold mb-2 group-data-[collapsible=icon]:hidden">
                Overview
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center">
                  <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      onClick={() => handleViewChange("details")}
                      isActive={currentView === "details"}
                      tooltip="My Details"
                      className="text-white/70 hover:text-white hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white h-10 px-3 rounded-lg transition-all duration-200 group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center"
                    >
                      <User className="size-4 group-data-[collapsible=icon]:!size-5 group-data-[collapsible=icon]:!m-0" />
                      <span className="font-inter text-sm font-medium tracking-wide group-data-[collapsible=icon]:hidden">My Details</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      onClick={() => handleViewChange("devices")}
                      isActive={currentView === "devices"}
                      tooltip="My Devices"
                      className="text-white/70 hover:text-white hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white h-10 px-3 rounded-lg transition-all duration-200 group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center"
                    >
                      <Package className="size-4 group-data-[collapsible=icon]:!size-5 group-data-[collapsible=icon]:!m-0" />
                      <span className="font-inter text-sm font-medium tracking-wide group-data-[collapsible=icon]:hidden">My Devices</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      onClick={() => handleViewChange("assets")}
                      isActive={currentView === "assets"}
                      tooltip="My Assets"
                      className="text-white/70 hover:text-white hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white h-10 px-3 rounded-lg transition-all duration-200 group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center"
                    >
                      <ImageIcon className="size-4 group-data-[collapsible=icon]:!size-5 group-data-[collapsible=icon]:!m-0" />
                      <span className="font-inter text-sm font-medium tracking-wide group-data-[collapsible=icon]:hidden">My Assets</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      onClick={() => handleViewChange("derivatives")}
                      isActive={currentView === "derivatives"}
                      tooltip="My Derivatives"
                      className="text-white/70 hover:text-white hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white h-10 px-3 rounded-lg transition-all duration-200 group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center"
                    >
                      <Layers className="size-4 group-data-[collapsible=icon]:!size-5 group-data-[collapsible=icon]:!m-0" />
                      <span className="font-inter text-sm font-medium tracking-wide group-data-[collapsible=icon]:hidden">My Derivatives</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      onClick={() => handleViewChange("claims")}
                      isActive={currentView === "claims"}
                      tooltip="Claim History"
                      className="text-white/70 hover:text-white hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white h-10 px-3 rounded-lg transition-all duration-200 group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center"
                    >
                      <DollarSign className="size-4 group-data-[collapsible=icon]:!size-5 group-data-[collapsible=icon]:!m-0" />
                      <span className="font-inter text-sm font-medium tracking-wide group-data-[collapsible=icon]:hidden">Claim History</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-white/5 p-4 group-data-[collapsible=icon]:p-2">
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push("/")}
                  tooltip="Back to Home"
                  className="text-white/60 hover:text-white hover:bg-white/5 h-10 px-3 rounded-lg transition-all duration-200 group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center group-data-[collapsible=icon]:!mx-auto"
                >
                  <Home className="size-4 group-data-[collapsible=icon]:!size-5 group-data-[collapsible=icon]:!m-0" />
                  <span className="font-inter text-sm font-medium tracking-wide group-data-[collapsible=icon]:hidden">Back to Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={disconnectWallet}
                  tooltip="Logout"
                  className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 h-10 px-3 rounded-lg transition-all duration-200 group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center group-data-[collapsible=icon]:!mx-auto"
                >
                  <LogOut className="size-4 group-data-[collapsible=icon]:!size-5 group-data-[collapsible=icon]:!m-0" />
                  <span className="font-inter text-sm font-medium tracking-wide group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-[#050505] min-h-screen flex-1 overflow-auto">
          <div className="container max-w-6xl mx-auto p-6 md:p-12">
            {currentView === "details" && <MyDetails />}
            {currentView === "devices" && <MyDevices />}
            {currentView === "assets" && <MyAssets />}
            {currentView === "derivatives" && <MyDerivatives />}
            {currentView === "claims" && <ClaimHistory />}
          </div>
        </SidebarInset>
      </div>
      <Suspense fallback={null}>
        <DeviceRegistrationModal />
      </Suspense>
    </SidebarProvider>
  )
}
