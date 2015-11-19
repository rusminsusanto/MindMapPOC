//
//  AppDelegate.m
//  MindMap
//
//  Created by Rusmin Susanto on 11/11/2015.
//  Copyright (c) 2015 Rusmin Susanto. All rights reserved.
//

#import "AppDelegate.h"

@interface AppDelegate ()

@property (weak) IBOutlet NSWindow *window;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
	// Insert code here to initialize your application
	NSString *resourcesPath = [[NSBundle mainBundle] resourcePath];
	NSString *htmlPath = [resourcesPath stringByAppendingString:@"/hello.html"];
	NSString *urlAddress = [NSString stringWithFormat:@"file://%@", htmlPath];
	NSURL *url = [NSURL URLWithString:urlAddress];
	NSURLRequest *requestObj = [NSURLRequest requestWithURL:url];
	[[_webView mainFrame] loadRequest:requestObj];
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
	// Insert code here to tear down your application
}

@end
