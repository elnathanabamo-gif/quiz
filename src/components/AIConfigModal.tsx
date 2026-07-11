import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Key, Sparkles } from 'lucide-react';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSave: (apiKey: string) => void;
  serverConfigured?: boolean;
  serverReachable?: boolean;
}

function getStatusMessage(serverReachable: boolean, serverConfigured: boolean): string {
  if (!serverReachable) {
    return 'The API server is not running. In VS Code terminal, run npm run dev (not just vite). If you already added .env, stop the server with Ctrl+C and start it again.';
  }
  if (!serverConfigured) {
    return 'The server is running but did not find OPENAI_API_KEY in .env. Check your .env file in the project root, then restart npm run dev.';
  }
  return 'Enter your OpenAI API key to continue, or skip for basic local generation.';
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSave,
  serverConfigured = false,
  serverReachable = false,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setError('Invalid API key format. OpenAI API keys start with "sk-"');
      return;
    }

    onConfigSave(apiKey.trim());
    setApiKey('');
    setError('');
  };

  const handleSkip = () => {
    onConfigSave('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Sparkles className="w-4 h-4" />
            <AlertDescription>{getStatusMessage(serverReachable, serverConfigured)}</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              OpenAI API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              className="font-mono"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Quick fix if .env is already set:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Stop the terminal with Ctrl+C</li>
              <li>Run <code className="text-xs bg-muted px-1 rounded">npm run dev</code></li>
              <li>Look for <code className="text-xs bg-muted px-1 rounded">OpenAI configured: true</code></li>
            </ol>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip (Local Generation)
          </Button>
          <Button onClick={handleSave}>Save & Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIConfigModal;
