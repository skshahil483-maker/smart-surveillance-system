import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("train_activity")

class SequenceDataset(Dataset):
    def __init__(self, num_samples=500, seq_len=16, feature_dim=128, num_classes=6):
        self.samples = torch.randn(num_samples, seq_len, feature_dim)
        self.labels = torch.randint(0, num_classes, (num_samples,))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        return self.samples[idx], self.labels[idx]

class CnnLstmClassifier(nn.Module):
    def __init__(self, feature_dim=128, hidden_dim=64, num_classes=6, num_layers=2):
        super(CnnLstmClassifier, self).__init__()
        self.lstm = nn.LSTM(feature_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_step = lstm_out[:, -1, :]
        out = self.fc(last_step)
        return out

def train_activity_model(epochs=15, batch_size=32, lr=0.001):
    logger.info("Initializing CNN + LSTM Temporal Sequence Training...")

    dataset = SequenceDataset(num_samples=600)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = CnnLstmClassifier()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    for epoch in range(1, epochs + 1):
        running_loss = 0.0
        correct = 0
        total = 0

        for seqs, labels in dataloader:
            optimizer.zero_grad()
            outputs = model(seqs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * seqs.size(0)
            _, preds = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (preds == labels).sum().item()

        epoch_loss = running_loss / total
        epoch_acc = (correct / total) * 100.0

        if epoch % 3 == 0 or epoch == epochs:
            logger.info(f"Epoch [{epoch}/{epochs}] - Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}%")

    logger.info("CNN + LSTM Activity Model trained successfully.")
    return model

if __name__ == "__main__":
    train_activity_model()
