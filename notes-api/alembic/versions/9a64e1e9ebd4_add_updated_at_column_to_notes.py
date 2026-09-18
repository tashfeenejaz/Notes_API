"""add updated_at column to notes

Revision ID: 9a64e1e9ebd4
Revises: 9213896b493a
Create Date: 2026-08-04 11:48:34.181518

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a64e1e9ebd4'
down_revision: Union[str, Sequence[str], None] = '9213896b493a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # server_default here (not just a Python-side default) is what lets
    # this run safely even if 'notes' already has rows -- PostgreSQL
    # rejects adding a NOT NULL column with no default on a non-empty
    # table. We backfill existing rows via the default, then drop the
    # server-side default afterward so future inserts go through the
    # normal SQLAlchemy model default instead.
    op.add_column(
        'notes',
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.alter_column('notes', 'updated_at', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('notes', 'updated_at')
