import { useState } from "react";
import { Bell, X, CheckCheck, Clock, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  time: string;
  isRead: boolean;
}

// Initial notifications - empty by default, will be populated when new notifications are added
const initialNotifications: Notification[] = [];

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case "warning":
      return AlertCircle;
    case "success":
      return CheckCheck;
    case "error":
      return AlertCircle;
    case "info":
      return Info;
    default:
      return Info;
  }
}

function getNotificationColor(type: Notification['type']) {
  switch (type) {
    case "warning":
      return "text-warning";
    case "success":
      return "text-success";
    case "error":
      return "text-destructive";
    case "info":
      return "text-primary";
    default:
      return "text-muted-foreground";
  }
}

export function NotificationButton() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              قراءة الكل
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div key={notification.id}>
                    <div
                      className={cn(
                        "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                        !notification.isRead && "bg-primary/5"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className={cn("mt-1", getNotificationColor(notification.type))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className={cn(
                            "text-sm font-medium leading-none",
                            !notification.isRead && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => setIsOpen(false)}
            >
              عرض جميع الإشعارات
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}